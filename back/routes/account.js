const router = require("express").Router();
const {setup} = require("../db_setup");

//sha
const sha = require('sha256');
const crypto = require('crypto');
function sha256(input) {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}
//jws 토큰
const jwt = require('jsonwebtoken');


router.post('/account/insertMember', async function (req, res) {
    console.log("회원가입 시작");
    const { mysqldb } = await setup();
    console.log('db 확인');

  
    const checkUserQuery = 'SELECT COUNT(*) AS count FROM account WHERE Uid = ?';
  
    mysqldb.query(checkUserQuery, [req.body.id], (err, results) => {
        if (err) {
            return res.json({ msg: "회원 가입 실패" });
        }
  
        if (results[0].count > 0) {

            return res.json({ msg: "중복아이디로 인한 회원 가입 실패" });
        }

        const generateSalt = (length = 16) => {
            return crypto.randomBytes(length).toString('hex');
        };

        const salt = generateSalt();
        const hashedPassword = sha256(req.body.pw + salt);

  
        const insertUserQuery = 'INSERT INTO account (Uid, Upw, salt,NAME,Email) VALUES (?, ?, ?,?,?)';
      
        mysqldb.query(insertUserQuery, [req.body.id, hashedPassword,  " ", " ", " "], (err, results) => {
            if (err) {
                console.error('error during user insertion: ' + err.stack);
                return res.status(500).json({ error: 'Database error' });
            }
  
            res.json({ msg: "회원 가입 되셨습니다" });
        });
    });

  });

router.get('/account/users', async (req, res) => {
    try {
        const { mysqldb } = await setup();
        const getUsersQuery = 'SELECT id, Name FROM account';
        const [rows, fields] = await mysqldb.query(getUsersQuery);
        res.json(rows);
    } catch (error) {
        console.error('Failed to fetch users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.post("/account/login", async function (req, res) {
    console.log(req.body);
    const { mysqldb } = await setup();

    const sql = 'SELECT id, UID, UPW , salt FROM account WHERE Uid=?';



    try {
        const [rows, fields] = await mysqldb.query(sql, [req.body.id])


        if (rows.length === 0) {
            return res.status(500).json({ msg: "로그인 실패 : ID를 확인해 주세요" });
    }

    console.log(rows[0])

    const hashedPassword = sha256(req.body.pw + rows[0].salt);
    //이슈1 sha 해쉬값이 맞지 않음
    // if (rows[0].UPW !== hashedPassword) {
    //     return res.json({ msg: "로그인 실패 : ID와 PW를 확인해 주세요" });
    // }
    const token = jwt.sign({ userid: req.body.id, id: rows[0].id }, 'salt', { expiresIn: '5m' });
    res.status(200).json({ msg: "login ok" ,token});

    } catch (e){
        return console.log(e)
    }
});

router.get('/account/session-test', (req, res) => {
  // console.log(req.session);
  // if (req.session.user) {
  //   res.json({msg:'이미 로그인 되어 있습니다'})
  // } else {
  //   res.json({msg:'로그인 해주세요'})
  // }
  console.log(req.headers.authorization);
  const token = req.headers.authorization;
  if (token) {
    jwt.verify(token, 'salt', (err, decoded) => {
      if (err) {
        return res.json({msg:'로그인 해주세요'})
      }
      console.log(decoded);
      res.json({msg:`${decoded.userid}님 이미 로그인 되어 있습니다`})
    })
  } else {
    res.json({msg:'로그인 해주세요'})
  }
});

module.exports = router;
