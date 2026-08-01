export {};

async function runApiTest() {
  try {
    const baseURL = 'http://localhost:5001/api/v1';
    
    // 1. Login as admin
    const loginRes = await fetch(`${baseURL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hafeef@gmail.com', password: 'password123' })
    });
    
    const cookies = loginRes.headers.getSetCookie();
    console.log('Login cookies:', cookies);

    // 2. Fetch users
    const usersRes = await fetch(`${baseURL}/users`, {
      headers: { Cookie: cookies.join(';') }
    });
    const usersData = (await usersRes.json()) as any;
    console.log('usersRes:', usersRes.status, usersData);
    console.log('Users:', usersData.data.map((u: any) => ({ id: u.id, email: u.email })));
    
    const user = usersData.data[0];
    if (!user) return;

    // 3. Update status
    const updateRes = await fetch(`${baseURL}/users/${user.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookies.join(';') },
      body: JSON.stringify({ status: 'ACTIVE' })
    });
    console.log('Update status res:', await updateRes.json());
    
    // 4. Update role
    const updateRoleRes = await fetch(`${baseURL}/users/${user.id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookies.join(';') },
      body: JSON.stringify({ roleId: user.roleId })
    });
    console.log('Update role res:', await updateRoleRes.json());

  } catch (err: any) {
    console.error('Error:', err);
  }
}

runApiTest();
