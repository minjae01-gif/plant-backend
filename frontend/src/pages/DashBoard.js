// 📌 Dashboard.js
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io("http://localhost:5000"); 
// 백엔드 주소 (ngrok 사용 시 ngrok 주소로 변경)

function Dashboard() {
  const [data, setData] = useState({ soil: 0, light: 0 });

  useEffect(() => {
    // 서버에서 실시간 데이터 수신
    socket.on("sensorData", (newData) => {
      console.log("💚 새로운 센서 데이터:", newData);
      setData(newData);
    });

    return () => {
      socket.off("sensorData");
    };
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🌱 실시간 스마트 화분 대시보드</h1>

      <div style={styles.card}>
        <h2>🌡 토양 습도</h2>
        <p style={styles.value}>{data.soil}</p>
      </div>

      <div style={styles.card}>
        <h2>💡 조도(Light)</h2>
        <p style={styles.value}>{data.light}</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "40px",
    textAlign: "center",
  },
  title: {
    fontSize: "32px",
    marginBottom: "30px",
  },
  card: {
    background: "#fff",
    padding: "20px",
    margin: "20px auto",
    width: "300px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  value: {
    fontSize: "48px",
    fontWeight: "bold",
  }
};

export default Dashboard;
