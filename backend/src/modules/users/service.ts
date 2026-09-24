import { BaseService } from '../../core/base';
import { NotFoundError, UnauthorizedError } from '../../core/error';
import type { PasswordHasher } from '../../core/security/password';
import type {
  ChangePasswordInput,
  Profile,
  UpdateProfileInput,
  UpdateUserInput,
  User,
} from './contract';
import type { ProfileChanges, UserRepository } from './repository';

// Porta definida pelo consumidor: users só precisa revogar sessões, e o
// módulo auth a satisfaz sem que users dependa dele.
export interface SessionRevoker {
  revokeAllSessions(userId: number, reason: 'password'): Promise<void>;
}

export interface UserServiceDeps {
  passwords: PasswordHasher;
  sessions: SessionRevoker;
}

// Contrato público do service: é o que sai do módulo (ver index.ts).
export interface UserService {
  findMe(userId: number): Promise<User>;
  updateMe(userId: number, input: UpdateUserInput): Promise<User>;
  changePassword(userId: number, input: ChangePasswordInput): Promise<void>;
  findMyProfile(userId: number): Promise<Profile>;
  updateMyProfile(userId: number, input: UpdateProfileInput): Promise<Profile>;
}

const USER_NOT_FOUND = 'Usuário não encontrado';
const PROFILE_NOT_FOUND = 'Perfil não encontrado';

export class UserServiceImpl
  extends BaseService<UserRepository>
  implements UserService
{
  constructor(
    repository: UserRepository,
    private readonly deps: UserServiceDeps,
  ) {
    super(repository);
  }

  async findMe(userId: number): Promise<User> {
    const user = await this.repository.findById(userId);

    if (!user) {
      throw new NotFoundError(USER_NOT_FOUND);
    }

    return user;
  }

  async updateMe(userId: number, input: UpdateUserInput): Promise<User> {
    if (input.name === undefined) {
      return this.findMe(userId);
    }

    const user = await this.repository.updateName(userId, input.name);

    if (!user) {
      throw new NotFoundError(USER_NOT_FOUND);
    }

    return user;
  }

  async changePassword(
    userId: number,
    input: ChangePasswordInput,
  ): Promise<void> {
    const stored = await this.repository.findPasswordHash(userId);

    if (!stored) {
      throw new NotFoundError(USER_NOT_FOUND);
    }

    const valid = await this.deps.passwords.verify(
      input.currentPassword,
      stored,
    );

    if (!valid) {
      throw new UnauthorizedError('Senha atual incorreta');
    }

    const hash = await this.deps.passwords.hash(input.newPassword);
    await this.repository.updatePasswordHash(userId, hash);
    await this.deps.sessions.revokeAllSessions(userId, 'password');
  }

  async findMyProfile(userId: number): Promise<Profile> {
    const profile = await this.repository.findProfileByUserId(userId);

    if (!profile) {
      throw new NotFoundError(PROFILE_NOT_FOUND);
    }

    return profile;
  }

  async updateMyProfile(
    userId: number,
    input: UpdateProfileInput,
  ): Promise<Profile> {
    const profile = await this.repository.updateProfile(
      userId,
      toProfileChanges(input),
    );

    if (!profile) {
      throw new NotFoundError(PROFILE_NOT_FOUND);
    }

    return profile;
  }
}

// O username é também o slug público do perfil; campos ausentes não mudam.
function toProfileChanges(input: UpdateProfileInput): ProfileChanges {
  const changes: ProfileChanges = {};

  if (input.username !== undefined) {
    changes.username = input.username;
    changes.slugUrl = input.username;
  }

  if (input.bio !== undefined) {
    changes.bio = input.bio;
  }

  if (input.urlPhoto !== undefined) {
    changes.urlPhoto = input.urlPhoto;
  }

  return changes;
}
