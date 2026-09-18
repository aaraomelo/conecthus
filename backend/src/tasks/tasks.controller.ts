import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator.js';
import { TasksService } from './tasks.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { TaskQueryDto } from './dto/task-query.dto.js';
import { TaskListResponse, TaskResponse } from './dto/task-response.dto.js';
import type { Task } from '../generated/prisma/client.js';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a task and publish an MQTT notification' })
  @ApiResponse({ status: 201, type: TaskResponse })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTaskDto,
  ): Promise<Task> {
    return this.tasksService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List tasks with filters (cached in Redis)' })
  @ApiResponse({ status: 200, type: TaskListResponse })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: TaskQueryDto,
  ): Promise<TaskListResponse> {
    return this.tasksService.findAll(user.userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single task' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: TaskResponse })
  @ApiResponse({ status: 404, description: 'Task not found' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Task> {
    return this.tasksService.findOne(user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: TaskResponse })
  @ApiResponse({ status: 404, description: 'Task not found' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
  ): Promise<Task> {
    return this.tasksService.update(user.userId, id, dto);
  }

  @Patch(':id/done')
  @ApiOperation({ summary: 'Mark a task as completed' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: TaskResponse })
  @ApiResponse({ status: 404, description: 'Task not found' })
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Task> {
    return this.tasksService.complete(user.userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Task deleted' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ deleted: boolean }> {
    await this.tasksService.remove(user.userId, id);
    return { deleted: true };
  }
}