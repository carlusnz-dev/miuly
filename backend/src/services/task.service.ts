import type { TaskModel } from '../generated/prisma/models.js';
import Logger from '../lib/logger.js';
import {
  createTask,
  deleteTask,
  findAllTasksByUserId,
  findTaskById,
  updateTask,
} from '../repositories/task.repository.js';
import { findTypeById } from '../repositories/types.repository.js';
import { findUserById } from '../repositories/user.repository.js';
import type { ServiceResult } from '../types/result.type.js';
import type { CreateTaskInput, UpdateTaskInput } from '../types/task.type.js';

interface TaskId {
  id: number;
}

export async function createTaskService(
  data: CreateTaskInput,
  userId: number,
): Promise<
  ServiceResult<
    Pick<TaskModel, 'name' | 'priority' | 'due_date' | 'created_at'> & TaskId
  >
> {
  Logger.debug('Iniciado a criação de Task.');

  try {
    const foundUser = await findUserById(userId);
    if (!foundUser) {
      Logger.error('Usuário não encontrado!');
      return {
        ok: false,
        reason: 'not_found',
        message: 'Usuário não foi encontrado.',
      };
    }

    const foundType = await findTypeById(data.type_id, userId);
    if (!foundType) {
      Logger.error('Tipo não encontrado.');
      return {
        ok: false,
        reason: 'not_found',
        message: 'Tipo não foi encontrado.',
      };
    }

    if (!foundType.applies_to.includes('TASK')) {
      Logger.error('O tipo fornecido não contém TASK.');
      return {
        ok: false,
        reason: 'error',
        message: 'O tipo fornecido não pertence a TASK.',
      };
    }

    const newTask = await createTask(
      {
        name: data.name,
        description: data.description,
        type_id: data.type_id,
        due_date: data.due_date,
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.sync !== undefined && { sync: data.sync }),
      },
      userId,
    );
    const { id, name, priority, due_date, created_at } = newTask;
    Logger.info(`Tarefa ID ${id} criada com sucesso!`);
    return {
      ok: true,
      data: { id: Number(id), name, priority, due_date, created_at },
    };
  } catch (error) {
    Logger.error(`Erro ao criar a tarefa: ${error}`);
    return {
      ok: false,
      reason: 'error',
      message: 'Erro ao criar a tarefa.',
    };
  }
}

export async function updateTaskService(
  id: number,
  userId: number,
  data: UpdateTaskInput,
): Promise<
  ServiceResult<
    Pick<
      TaskModel,
      | 'name'
      | 'description'
      | 'priority'
      | 'type_id'
      | 'due_date'
      | 'sync'
      | 'updated_at'
    > &
      TaskId
  >
> {
  Logger.debug('Iniciado a atualização de Task.');

  try {
    const foundUser = await findUserById(userId);
    const foundTask = await findTaskById(id, userId);
    if (!foundUser || !foundTask) {
      Logger.error('Não foi encontrado nenhum usuário ou tarefa.');
      return {
        ok: false,
        reason: 'not_found',
        message: 'Não foi encontrado tarefa ou usuário.',
      };
    }

    if (data.type_id !== undefined) {
      const foundType = await findTypeById(data.type_id, userId);
      if (!foundType) {
        Logger.error('Tipo não encontrado.');
        return {
          ok: false,
          reason: 'not_found',
          message: 'Tipo não foi encontrado.',
        };
      }
      if (!foundType.applies_to.includes('TASK')) {
        Logger.error('O tipo fornecido não contém TASK.');
        return {
          ok: false,
          reason: 'error',
          message: 'O tipo fornecido não pertence a TASK.',
        };
      }
    }

    const updatedTask = await updateTask(id, userId, {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.type_id !== undefined && { type_id: data.type_id }),
      ...(data.due_date !== undefined && { due_date: data.due_date }),
      ...(data.sync !== undefined && { sync: data.sync }),
    });
    const { name, description, priority, type_id, due_date, sync, updated_at } =
      updatedTask;
    Logger.info(`Tarefa ID ${id} atualizada com sucesso!`);
    return {
      ok: true,
      data: {
        id: Number(updatedTask.id),
        name,
        description,
        priority,
        type_id,
        due_date,
        sync,
        updated_at,
      },
    };
  } catch (error) {
    Logger.error(`Erro ao atualizar a tarefa: ${error}`);
    return {
      ok: false,
      reason: 'error',
      message: 'Erro ao atualizar a tarefa.',
    };
  }
}

export async function deleteTaskService(
  id: number,
  userId: number,
): Promise<ServiceResult<Pick<TaskModel, 'name' | 'created_at'> & TaskId>> {
  Logger.debug('Iniciado a remoção de Task.');

  try {
    const foundUser = await findUserById(userId);
    const foundTask = await findTaskById(id, userId);
    if (!foundUser || !foundTask) {
      Logger.error('Não foi encontrado nenhum usuário ou tarefa.');
      return {
        ok: false,
        reason: 'not_found',
        message: 'Não foi encontrado tarefa ou usuário.',
      };
    }

    const deletedTask = await deleteTask(id, userId);
    const { name, created_at } = deletedTask;
    Logger.info(`Tarefa ID ${id} deletada com sucesso!`);
    return {
      ok: true,
      data: { id: Number(deletedTask.id), name, created_at },
    };
  } catch (error) {
    Logger.error(`Erro ao deletar a tarefa: ${error}`);
    return {
      ok: false,
      reason: 'error',
      message: 'Erro ao deletar a tarefa.',
    };
  }
}

export async function findTaskByIdService(
  id: number,
  userId: number,
): Promise<ServiceResult<Omit<TaskModel, 'user_id' | 'id'> & TaskId>> {
  Logger.debug(`Iniciado busca pela tarefa com id ${id}`);

  try {
    const foundUser = await findUserById(userId);
    if (!foundUser) {
      Logger.error('Usuário não encontrado.');
      return {
        ok: false,
        reason: 'not_found',
        message: 'Usuário não foi encontrado.',
      };
    }

    const foundTask = await findTaskById(id, userId);
    if (!foundTask) {
      Logger.error('Tarefa não encontrada.');
      return {
        ok: false,
        reason: 'not_found',
        message: 'Tarefa não foi encontrada.',
      };
    }

    const { user_id, id: taskId, ...task } = foundTask;
    void user_id;

    Logger.info('Tarefa foi encontrada!');
    return {
      ok: true,
      data: { id: Number(taskId), ...task },
    };
  } catch (error) {
    Logger.error(`Erro ao procurar a tarefa: ${error}`);
    return {
      ok: false,
      reason: 'error',
      message: 'Erro ao buscar a tarefa.',
    };
  }
}

export async function findAllTasksByUserIdService(
  userId: number,
): Promise<ServiceResult<(Omit<TaskModel, 'user_id' | 'id'> & TaskId)[]>> {
  Logger.debug('Iniciado busca por todas as tarefas do usuário.');

  try {
    const foundUser = await findUserById(userId);
    if (!foundUser) {
      Logger.error('Usuário não encontrado.');
      return {
        ok: false,
        reason: 'not_found',
        message: 'Usuário não foi encontrado.',
      };
    }

    const foundTasks = await findAllTasksByUserId(userId);
    if (foundTasks.length == 0) {
      Logger.info('Não foi encontrado nenhuma tarefa para este usuário.');
      return {
        ok: false,
        reason: 'not_found',
        message: 'Não há tarefas registradas neste usuário.',
      };
    }

    Logger.info('Todas as tarefas foram encontradas.');
    return {
      ok: true,
      data: foundTasks.map(({ id, ...task }) => ({ id: Number(id), ...task })),
    };
  } catch (error) {
    Logger.error(`Erro ao procurar as tarefas: ${error}`);
    return {
      ok: false,
      reason: 'error',
      message: 'Erro ao procurar as tarefas.',
    };
  }
}
