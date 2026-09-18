import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { TaskStatus } from '../../generated/prisma/enums.js';
import type { Task } from '../../generated/prisma/client.js';

export class TaskResponse implements Task {
  @ApiProperty() id: number;
  @ApiProperty() title: string;
  @ApiPropertyOptional() description: string | null;
  @ApiPropertyOptional({ enum: TaskStatus }) status: TaskStatus;
  @ApiPropertyOptional() dueDate: Date | null;
  @ApiProperty() userId: number;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class TaskListResponse {
  @ApiProperty({ type: [TaskResponse] })
  items: Task[];

  @ApiProperty() total: number;

  @ApiProperty() page: number;

  @ApiProperty() pageSize: number;

  @ApiProperty() totalPages: number;
}