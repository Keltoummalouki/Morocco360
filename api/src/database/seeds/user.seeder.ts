import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '../../users/entities/user.entity';
import { Role, RoleName } from '../../users/entities/role.entity';

interface SeedUser {
  username: string;
  email: string;
  password: string;
  full_name: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
  roleName: RoleName;
  status?: UserStatus;
}

/**
 * One account per role plus a pool of regular customers, so every dashboard
 * and every list/filter screen has something to show.
 */
const SEED_USERS: SeedUser[] = [
  {
    username: 'admin',
    email: 'admin@morocco360.ma',
    password: 'Admin1234',
    full_name: 'Administrator',
    first_name: 'Admin',
    last_name: 'Morocco360',
    phone_number: '+212600000001',
    date_of_birth: '1988-01-15',
    roleName: RoleName.ADMIN,
  },
  {
    username: 'organizer',
    email: 'organizer@morocco360.ma',
    password: 'Organizer1234',
    full_name: 'Event Organizer',
    first_name: 'Event',
    last_name: 'Organizer',
    phone_number: '+212600000002',
    date_of_birth: '1985-04-22',
    roleName: RoleName.ORGANIZER,
  },
  {
    username: 'organizer2',
    email: 'organizer2@morocco360.ma',
    password: 'Organizer1234',
    full_name: 'Yasmine Alaoui',
    first_name: 'Yasmine',
    last_name: 'Alaoui',
    phone_number: '+212600000003',
    date_of_birth: '1990-09-08',
    roleName: RoleName.ORGANIZER,
  },
  {
    username: 'staff',
    email: 'staff@morocco360.ma',
    password: 'Staff1234',
    full_name: 'Hicham Benali',
    first_name: 'Hicham',
    last_name: 'Benali',
    phone_number: '+212600000004',
    date_of_birth: '1995-02-11',
    roleName: RoleName.STAFF,
  },
  {
    username: 'staff2',
    email: 'staff2@morocco360.ma',
    password: 'Staff1234',
    full_name: 'Loubna Cherkaoui',
    first_name: 'Loubna',
    last_name: 'Cherkaoui',
    phone_number: '+212600000005',
    date_of_birth: '1997-07-30',
    roleName: RoleName.STAFF,
  },
  {
    username: 'user',
    email: 'user@morocco360.ma',
    password: 'User1234',
    full_name: 'Test User',
    first_name: 'Test',
    last_name: 'User',
    phone_number: '+212600000006',
    date_of_birth: '1998-03-19',
    roleName: RoleName.USER,
  },
  {
    username: 'amine',
    email: 'amine.tazi@example.ma',
    password: 'User1234',
    full_name: 'Amine Tazi',
    first_name: 'Amine',
    last_name: 'Tazi',
    phone_number: '+212611111101',
    date_of_birth: '1993-11-02',
    roleName: RoleName.USER,
  },
  {
    username: 'sara',
    email: 'sara.bennis@example.ma',
    password: 'User1234',
    full_name: 'Sara Bennis',
    first_name: 'Sara',
    last_name: 'Bennis',
    phone_number: '+212611111102',
    date_of_birth: '1996-06-25',
    roleName: RoleName.USER,
  },
  {
    username: 'youssef',
    email: 'youssef.idrissi@example.ma',
    password: 'User1234',
    full_name: 'Youssef Idrissi',
    first_name: 'Youssef',
    last_name: 'Idrissi',
    phone_number: '+212611111103',
    date_of_birth: '1991-12-14',
    roleName: RoleName.USER,
  },
  {
    username: 'imane',
    email: 'imane.raji@example.ma',
    password: 'User1234',
    full_name: 'Imane Raji',
    first_name: 'Imane',
    last_name: 'Raji',
    phone_number: '+212611111104',
    date_of_birth: '2000-05-05',
    roleName: RoleName.USER,
  },
  {
    username: 'karim',
    email: 'karim.ouazzani@example.ma',
    password: 'User1234',
    full_name: 'Karim Ouazzani',
    first_name: 'Karim',
    last_name: 'Ouazzani',
    phone_number: '+212611111105',
    date_of_birth: '1987-08-17',
    roleName: RoleName.USER,
  },
  {
    username: 'nadia',
    email: 'nadia.fassi@example.ma',
    password: 'User1234',
    full_name: 'Nadia Fassi',
    first_name: 'Nadia',
    last_name: 'Fassi',
    phone_number: '+212611111106',
    date_of_birth: '1994-01-28',
    roleName: RoleName.USER,
  },
  {
    username: 'lucie',
    email: 'lucie.martin@example.fr',
    password: 'User1234',
    full_name: 'Lucie Martin',
    first_name: 'Lucie',
    last_name: 'Martin',
    phone_number: '+33600000007',
    date_of_birth: '1992-10-09',
    roleName: RoleName.USER,
  },
  {
    // Locked account — exercises the /suspended page and the admin ban flow.
    username: 'suspended',
    email: 'suspended@morocco360.ma',
    password: 'User1234',
    full_name: 'Compte Suspendu',
    first_name: 'Compte',
    last_name: 'Suspendu',
    phone_number: '+212611111107',
    date_of_birth: '1999-04-03',
    roleName: RoleName.USER,
    status: UserStatus.SUSPENDED,
  },
];

@Injectable()
export class UserSeeder {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async seed(): Promise<void> {
    const roles = await this.roleRepo.find();
    const roleByName = new Map(roles.map((r) => [r.name, r]));

    for (const data of SEED_USERS) {
      const exists = await this.userRepo.findOne({
        where: { email: data.email },
      });
      if (exists) {
        console.log(`  [UserSeeder] User already exists: ${data.email}`);
        continue;
      }

      const role = roleByName.get(data.roleName);
      if (!role) {
        console.warn(
          `  [UserSeeder] Role not found: ${data.roleName} — run role seeder first`,
        );
        continue;
      }

      const user = this.userRepo.create({
        username: data.username,
        email: data.email,
        password: await bcrypt.hash(data.password, 12),
        full_name: data.full_name,
        first_name: data.first_name,
        last_name: data.last_name,
        phone_number: data.phone_number,
        date_of_birth: data.date_of_birth,
        status: data.status ?? UserStatus.ACTIVE,
        role,
      });
      await this.userRepo.save(user);
      console.log(
        `  [UserSeeder] Created user: ${data.email} (${data.roleName})`,
      );
    }
  }
}
