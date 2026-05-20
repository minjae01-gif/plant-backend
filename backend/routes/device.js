const express = require('express');
const router = express.Router();

const db = require('../config/db');
const { verifyToken: authenticateToken } =
  require('./auth');


// ==============================
// 디바이스 등록
// ==============================
router.post(
  '/register',
  authenticateToken,
  async (req, res) => {

    try {

      const userId =
        req.user.userId;

      const {
        device_key,
        device_name
      } = req.body;

      if (!device_key) {

        return res.status(400).json({
          success: false,
          message: 'device_key 필요'
        });
      }

      // 이미 등록된 device인지 확인
      const [exists] = await db.query(
        `
        SELECT *
        FROM user_devices
        WHERE device_key = ?
        `,
        [device_key]
      );

      if (exists.length > 0) {

        return res.status(400).json({
          success: false,
          message:
            '이미 등록된 디바이스입니다.'
        });
      }

      // 등록
      await db.query(
        `
        INSERT INTO user_devices
        (
          user_id,
          device_key,
          device_name
        )
        VALUES (?, ?, ?)
        `,
        [
          userId,
          device_key,
          device_name || '내 화분'
        ]
      );

      res.json({
        success: true,
        message:
          '디바이스 등록 완료'
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        success: false
      });
    }
  }
);

// ==============================
// 내 디바이스 목록 조회
// ==============================
router.get(
  '/my',
  authenticateToken,
  async (req, res) => {

    try {

      const userId =
        req.user.userId;

      const [rows] = await db.query(
        `
        SELECT *
        FROM user_devices
        WHERE user_id = ?
        ORDER BY id DESC
        `,
        [userId]
      );

      res.json({
        success: true,
        devices: rows
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        success: false
      });
    }
  }
);

module.exports = router;