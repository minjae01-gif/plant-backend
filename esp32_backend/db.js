const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',    
    user: 'root',          
    password: '0000', 
    database: 'TEST',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0     
}).promise();

console.log('MYSQL Pool이 생성되었습니다');

//'pool' 객체를(db를) 다른 파일에서 사용할 수 있도록 
module.exports = pool;
