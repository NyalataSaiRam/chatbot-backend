const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


const conn = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DBNAME,
    port: process.env.DB_PORT
});

app.get("/", (req, res) => {

    res.send('working');
});

app.get('/user/:id', (req, res) => {
    const { id } = req.params;
    console.log(id);
    const query = 'select * from bank_details where userId=?';
    conn.query(query, [ id ], function (err, [ results ], fields) {
        if (err) {
            return res.status(500).json({ error: err.message });
        } else {
            return res.status(200).json({ result: results });
        }
    });
});

app.post('/user', (req, res) => {
    const user = [ req.body.uname, req.body.accntType, req.body.phone ];
    let q = 'insert into bank_details (uname, accnt_type, ph_no) values ?';
    conn.query(q, [ [ user ] ], function (err, results) {
        if (err) {
            console.log(err);
            return res.status(200).json({ error: 'Internal server error' });
        }
        // console.log(results);
        return res.status(201).json({ message: 'Account created', insertId: results.insertId });
    });

});

app.post('/transaction', (req, res) => {
    const { userId, receiverId, amount } = req.body;
    let q0 = 'select balance from bank_details where userId=?';
    let q1 = 'UPDATE bank_details SET balance = balance - ? WHERE userId = ?';
    let q2 = 'UPDATE bank_details SET balance = balance + ? WHERE userId = ?';
    conn.query(q0, [ userId ], function (err, [ results ]) {
        if (err) {
            console.log(err);
            return res.status(200).json({ error: 'Internal server error' });
        }
        if (parseFloat(results.balance) >= amount) {
            conn.query(q1, [ amount, userId ], function (err, results) {
                if (err) return res.status(500).json({ error: 'Internal server error' });

                conn.query(q2, [ amount, receiverId ], function (err, results) {
                    if (err) return res.status(500).json({ error: 'Internal server error' });
                });
            });
            return res.status(200).json({ message: "Transaction successfull" });
        } else {
            return res.status(200).json({ message: "Insufficient balance" });
        }

    });

});

app.put('/user', (req, res) => {
    const { userId, phone } = req.body;

    conn.query('update bank_details set ph_no=? where userId=?', [ phone, userId ], function (err, results) {
        if (err) return res.status(500).json({ error: "Internal server error" });
        return res.status(200).json({ message: "Updated successfully" });

    });
});

app.delete('/user/:userId', (req, res) => {
    const { userId } = req.params;
    console.log(userId);

    conn.query('delete from bank_details where userId=?', [ userId ], function (err, results) {
        if (err) return res.status(500).json({ error: "Internal server error" });
        return res.status(200).json({ message: "Deleted successfully" });

    });
});


const u = 2;
const num = '1234567890';
// conn.query('update bank_details set ph_no=? where userId=?', [ num, u ], function (err, results) {
//     if (err) console.log(err.sqlMessage);
//     console.log(results);
// });
// conn.query('select balance from bank_details where userId=?', [ u ], function (err, [ results ]) {
//     if (err) console.log(err.sqlMessage);
//     console.log(parseFloat(results.balance));
// });

app.listen(process.env.PORT, () => console.log(`server running on port ${process.env.PORT}`));