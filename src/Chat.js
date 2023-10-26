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

    console.log(content);
    
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
        console.log(updated);
        return updated
      })

      textarea.current.value = ''
    }
  }

  const StatusIcon = ({ isConnected }) => {
    return (
      <i className={isConnected ? 'icon connected' : 'icon'}></i>
    )
  }

  useEffect(() => {
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

    socket.on("private message", ({ content, from }) => {
      const updateUsers = [...users]
      for(let i = 0; i < users.length; i++) {
        const user = updateUsers[i]
        if (user.userID === from) {
          user.messages.push({
            content,
            fromSelf: false,
          })

          console.log(user.userID, selectedUser,selectedUser?.userID, user.userID !== selectedUser?.userID);

          if (user.userID !== selectedUser?.userID) {
            user.hasNewMessages = true
          }

          break;
        }
      }
      setUsers(updateUsers)
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
      {selectedUser &&
        <div className='message-panel'>
          <div className='header'>
            {selectedUser.username}
          </div>
          <hr style={{marginBottom: '1.5rem'}}/>
          <ul className='message-list'>
            {selectedUser.messages.map((message, index) => (
              <li key={message.content + index}>
                <div className='sender'>
                  {message.fromSelf ? '(yourself)' : selectedUser.username}
                </div>
                {message.content}
              </li>
            ))}
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