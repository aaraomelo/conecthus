import { Test, TestingModule } from '@nestjs/testing';
import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import mqtt from 'mqtt';
import type { MqttClient } from 'mqtt';
import { AppModule } from './../src/app.module.js';
import { setupApp } from './../src/setup-app.js';

const unique = Date.now();
const email = `joao.${unique}@example.com`;
const password = 'superSecret123';

describe('Auth + Tasks (e2e)', () => {
  let app: INestApplication<App>;
  let httpServer: App;
  let accessToken: string;
  let otherToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('blocks access without a token', async () => {
    await request(httpServer).get('/api/tasks').expect(401);
  });

  it('registers a new user and returns a JWT', async () => {
    const res = await request(httpServer)
      .post('/api/auth/register')
      .send({ name: 'Joao Teste', email, password })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user).not.toHaveProperty('passwordHash');
    accessToken = res.body.accessToken;
  });

  it('rejects duplicate registration', async () => {
    await request(httpServer)
      .post('/api/auth/register')
      .send({ name: 'Outro', email, password })
      .expect(409);
  });

  it('rejects login with wrong password', async () => {
    await request(httpServer)
      .post('/api/auth/login')
      .send({ email, password: 'wrongPassword' })
      .expect(401);
  });

  it('logs in with valid credentials', async () => {
    const res = await request(httpServer)
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
  });

  it('creates a task and lists it (with cache)', async () => {
    const created = await request(httpServer)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Escrever testes', description: 'Cobrir fluxos', status: 'TODO' })
      .expect(201);

    expect(created.body.id).toBeGreaterThan(0);
    expect(created.body.userId).toBeDefined();

    const first = await request(httpServer)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(first.body.items.some((t: { id: number }) => t.id === created.body.id)).toBe(true);

    // Second read should be served from the Redis cache.
    const second = await request(httpServer)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(second.body.items).toEqual(first.body.items);
  });

  it('filters tasks by status', async () => {
    const res = await request(httpServer)
      .get('/api/tasks?status=DONE')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.items.length).toBe(0);

    const done = await request(httpServer)
      .get('/api/tasks?status=TODO')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(done.body.items.length).toBeGreaterThan(0);
  });

  it('updates a task and marks it as done', async () => {
    const created = await request(httpServer)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Update me' })
      .expect(201);

    const updated = await request(httpServer)
      .patch(`/api/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Updated title' })
      .expect(200);

    expect(updated.body.title).toBe('Updated title');

    const done = await request(httpServer)
      .patch(`/api/tasks/${created.body.id}/done`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(done.body.status).toBe('DONE');
  });

  it("cannot access another user's task (404)", async () => {
    const created = await request(httpServer)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Privado' })
      .expect(201);

    const other = await request(httpServer)
      .post('/api/auth/register')
      .send({ name: 'Outro Usuario', email: `outro.${unique}@example.com`, password })
      .expect(201);
    otherToken = other.body.accessToken;

    await request(httpServer)
      .get(`/api/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);

    await request(httpServer)
      .patch(`/api/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'hack' })
      .expect(404);
  });

  it('publishes an MQTT notification when a task is created', async () => {
    const notifUserId = (await request(httpServer)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)).body.id;

    const brokerUrl = process.env.MQTT_URL ?? 'mqtt://localhost:1883';
    const client: MqttClient = mqtt.connect(brokerUrl);

    const received = new Promise<{ type: string; taskId: number }>((resolve) => {
      client.on('connect', () => {
        client.subscribe(`notifications/${notifUserId}`);
      });
      client.on('message', (_topic, payload) => {
        const parsed = JSON.parse(payload.toString());
        if (parsed.type === 'TASK_CREATED') {
          resolve(parsed);
        }
      });
    });

    await request(httpServer)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Notificado por MQTT' })
      .expect(201);

    const message = await received;
    expect(message.type).toBe('TASK_CREATED');
    expect(message.taskId).toBeGreaterThan(0);
    client.end();
  });

  it('deletes a task', async () => {
    const created = await request(httpServer)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Vai sumir' })
      .expect(201);

    await request(httpServer)
      .delete(`/api/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(httpServer)
      .get(`/api/tasks/${created.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });
});