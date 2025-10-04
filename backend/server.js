const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'your-super-secret-key-that-should-be-in-env-vars';

app.use(cors());
app.use(bodyParser.json());

// Mock data - in a real app, this would come from a database
const mockAgents = [
    {
        id: 'UA-AG-001',
        name: 'Kato Mukasa',
        avatarUrl: `https://i.pravatar.cc/100?u=agent0`,
        email: `agent1@ug-aviation.gov`,
    }
];

const mockUsers = {
    'admin': {
        id: 'user-admin',
        username: 'admin',
        password: 'password', // In a real app, this should be a hash
        role: 'Administrator',
    },
    'agent': {
        id: 'user-agent1',
        username: 'agent',
        password: 'password',
        role: 'Agent',
        agent: mockAgents[0],
    }
};

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    const user = mockUsers[username];

    if (user && user.password === password) {
        const { password, ...userWithoutPassword } = user;
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.json({
            message: 'Login successful',
            token,
            user: userWithoutPassword,
        });
    } else {
        res.status(401).json({ message: 'Invalid username or password' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://127.0.0.1:${PORT}`);
});
