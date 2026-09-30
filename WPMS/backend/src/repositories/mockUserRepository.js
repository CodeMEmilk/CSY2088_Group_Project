//  The following is for testing user login and authentication
const users = [];
let nextUserId = 1;

async function findByEmail(email) {
    return users.find(
        user => user.email === email
    ) ?? null;
}

async function findById(userId) {
    return users.find(
        user => user.user_id === userId
    ) ?? null;
}

async function createUser({ name, email, password_hash }) {
    const existingUser = await findByEmail(email);

    if (existingUser) {
        return null;
    }

    const now = new Date().toISOString();

    const user = {
        user_id: nextUserId++,
        name,
        email,
        password_hash,
        account_status: "active",
        created_at: now,
        updated_at: now
    };

    users.push(user);

    return { ...user };
}

export {
    findByEmail,
    findById,
    createUser
};