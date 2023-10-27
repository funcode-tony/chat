import React, { useEffect, useRef, useState } from 'react'
import socket from './socket';
import './Draw.css'

const Draw = () => {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const isPaint = useRef(false)
  const canvasRef = useRef()


  const initUserProperties = (user) => {
    user.connected = true;
    user.messages = [];
    user.hasNewMessages = false;
  };

  const drawCanvas = (e) => {
    if (!isPaint.current) return
    const ctx = canvasRef.current.getContext("2d")
    ctx.beginPath();
    const coorX = e.nativeEvent.offsetX;
    const coorY = e.nativeEvent.offsetY;
    const radius = 10;
    ctx.arc(coorX, coorY, radius, 0, 2*Math.PI);
    ctx.fillStyle = "orange";
    ctx.fill()
    socket.emit('draw canvas', {
      coorX, 
      coorY,
    })
  }

  const StatusIcon = ({ isConnected }) => {
    return (
      <i className={isConnected ? 'icon connected' : 'icon'}></i>
    )
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    socket.on("connect", () => {
      const updated = [...users]
      updated.forEach((user) => {
        if (user.self) {
          user.connected = true
        }
      })
      setUsers(updated)
    })
    socket.on("users", (users) => {
      users.forEach(user => {
        user.self = user.userID === socket.id
        initUserProperties(user)
      });
      const sortedUser = users.sort((a, b) => {
        if (a.self) return -1;
        if (b.self) return 1;
        if (a.username < b.username) return -1;
        return a.username > b.username ? 1 : 0;
      })
      setUsers(sortedUser)
    })

    socket.on("user connected", (user) => {
      initUserProperties(user)
      setUsers(prev => {
        const updated = [...prev]
        updated.push(user)
        console.log(updated);
        return updated
      })
    })
    socket.on("draw canvas", ({ coorX, coorY }) => {
      console.log(coorX, coorY);
      ctx.beginPath();
      const radius = 10;
      ctx.arc(coorX, coorY, radius, 0, 2*Math.PI);
      ctx.fillStyle = "orange";
      ctx.fill()
    })

    socket.on("user disconnect", (id) => {
      const updateUsers = [...users]
      for (let i = 0; i < updateUsers.length; i++) {
        const user = updateUsers[i]
        if (user.userID === id) {
          user.connected = false
          break;
        }
      }
      console.log(updateUsers)
      setUsers(updateUsers)
    })

    socket.on("disconnect", () => {
      const updated = [...users]
      updated.forEach((user) => {
        if (user.self) {
          user.connected = false
        }
      })
      setUsers(updated)
    })

    return () => {
      socket.off("users")
      socket.off("user connected")
      socket.off("user disconnect")
      socket.off("private message")
      socket.off("connect")
      socket.off("disconnect")
    }
  }, [socket, users, selectedUser])
  return (
    <div className='chat-container'>
      <div className='left-panel'>
        {users.map(user => 
          <div 
            className={`user ${user.userID === selectedUser?.userID ? 'active' : ''}`}
            key={user.userID}
            onClick={() => { 
              if (user.self) return;
              console.log(user);
              // 需要想一下是否有需要用原先一起沿用user的物件，
              // 因為目前寫法 selecteduser 和 user 都是會互相影響的
              user.hasNewMessages = false
              setSelectedUser(user)
            }}
          >
            <div className='description'>
              <div className='name'>{user.self ? '(yourself) ' : ''}{user.username}</div>
              <div className='status'>
                <StatusIcon isConnected={user.connected}/>
              </div>
            </div>
            {/* 如果有新訊息跳一個驚嘆號 */}
            {user.hasNewMessages && <div className='new-message'>!</div>}
          </div>
        )}
      </div>
      <div>
        <canvas 
          ref={canvasRef}
          id='myCanvas'
          width='600' 
          height='400'
          onMouseMove={drawCanvas}
          onMouseDown={() => {isPaint.current = true}} 
          onMouseUp={() => {isPaint.current = false}}
          onMouseLeave={() => {isPaint.current = false}}
        ></canvas>
      </div>
    </div>
  )
}

export default Draw