import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { id: '6a5a2aede4199d569aa4c89d', roleId: '6a5a2d2b3a5dbc60d4ac087b' },
  '852373a97fa8e6a76fcdab713eb173ffd8244d9d0f8757b770b5386a6384aa9cda4380b86b8510716b17c4dda825b22adbbaab6ece4046a4b4ae0bd876ff9bb6',
  { expiresIn: '15m' }
);
console.log(token);
