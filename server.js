const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 创建或连接SQLite数据库
const db = new sqlite3.Database('./comments.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        // 创建评论表
        db.run(`CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            novelName TEXT NOT NULL,
            readTime TEXT NOT NULL,
            content TEXT NOT NULL,
            date TEXT NOT NULL,
            displayDate TEXT NOT NULL
        )`, (err) => {
            if (err) {
                console.error('Error creating table:', err);
            } else {
                console.log('Comments table ready');
            }
        });
    }
});

// 路由处理

// 获取所有评论
app.get('/api/comments', (req, res) => {
    db.all('SELECT * FROM comments ORDER BY id DESC', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 添加新评论
app.post('/api/comments', (req, res) => {
    const { username, novelName, readTime, content } = req.body;
    
    if (!username || !novelName || !readTime || !content) {
        return res.status(400).json({ error: '所有字段都是必需的' });
    }
    
    const date = new Date().toISOString();
    const displayDate = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    db.run(
        'INSERT INTO comments (username, novelName, readTime, content, date, displayDate) VALUES (?, ?, ?, ?, ?, ?)',
        [username, novelName, readTime, content, date, displayDate],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ 
                id: this.lastID,
                username,
                novelName,
                readTime,
                content,
                date,
                displayDate
            });
        }
    );
});

// 删除评论
app.delete('/api/comments/:id', (req, res) => {
    const id = req.params.id;
    
    db.run('DELETE FROM comments WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: '评论未找到' });
        }
        res.json({ message: '评论删除成功' });
    });
});

// 清空所有评论
app.delete('/api/comments', (req, res) => {
    db.run('DELETE FROM comments', function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: '所有评论已清空' });
    });
});

// 提供前端页面
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});

// 优雅关闭数据库连接
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('数据库连接已关闭');
        process.exit(0);
    });
});