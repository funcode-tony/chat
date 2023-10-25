import React, { useEffect, useRef, useState } from 'react'
import socket from './socket';
import './Chat.css'

const Chat = () => {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [isValid, setIsValid] = useState(false)
  const textarea = useRef()

  const initUserProperties = (user) => {
    user.connected = true;
    user.messages = [];
    user.hasNewMessages = false;
  };

  const sendPrivateMessage = (e) => {
    e.preventDefault()
    const content = textarea.current.value
    
    if (selectedUser) {
      socket.emit("private message", {
        content,
        to: selectedUser.userID,
      })

      setSelectedUser(prev => {
        const updated = {...prev}
        updated.messages.push({
          content,
          fromSelf: true,
        })
      })

      textarea.current.value = ''
    }
  }

  useEffect(() => {
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

    return () => {
      socket.off("users")
      socket.off("user connected")
    }
  }, [socket])
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
              setSelectedUser(user)
              // 這句不確定會不會影響到，若是影響畫面可能就得用usestate
              user.hasNewMessages = false
            }}
          >
            <div className='description'>
              <div className='name'>{user.self ? '[yourself]' : ''}{user.username}</div>
              <div className='status'>
                <i></i>
              </div>
            </div>
            {/* 如果有新訊息跳一個驚嘆號 */}
            {user.hasNewMessages && <div className='new-message'>!</div>}
          </div>
        )}
      </div>
      {selectedUser &&
        <div className='message-panel'>
          <div className='header'>
            {selectedUser.username}
          </div>
          <hr style={{marginBottom: '1.5rem'}}/>
          <ul className='message'>

          </ul>
          <form onSubmit={sendPrivateMessage}>
            <textarea
              ref={textarea}
              className='input' 
              onInput={(e) => {
                if (e.target.value !== '') {
                  setIsValid(true)
                } else {
                  setIsValid(false)
                }
              }}
            >
            </textarea>
            <button disabled={!isValid} className='send-btn'>Send</button>
          </form>
        </div>
      }
    </div>
  )
}

export default Chat