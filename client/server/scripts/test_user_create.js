import { UserModel } from '../models/User.js';

async function test() {
  try {
    const timestamp = Date.now();
    const newUser = await UserModel.create({
      name: `Salon Owner ${timestamp}`,
      email: `owner_${timestamp}@gmail.com`,
      phone: '9876543210',
      role_id: 1, // Admin
      branch_id: null,
      password: 'OwnerPassword@123'
    });
    console.log('UserModel.create SUCCESS:', newUser);

    const all = await UserModel.findAll();
    console.log('ALL USERS IN DB AFTER INSERT:');
    console.table(all.data || all);

    process.exit(0);
  } catch (err) {
    console.error('TEST FAILED:', err);
    process.exit(1);
  }
}

test();
