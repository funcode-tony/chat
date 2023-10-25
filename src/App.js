import { useRef, useEffect, useState } from 'react';
// import { v4 as uuidv4 } from 'uuid';
import socket from './socket';
import Chat from './Chat';
import './App.css';

function App() {
  const [username, setUsername] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  // const [rooms, setRooms] = useState([])
  // const [dialogs, setDialogs] = useState([])
  // const [isInRoom, setIsInRoom] = useState(false)
  // const [onlineUsers, setOnlineUsers] = useState([])
  const nameInput = useRef()
  
  const onLogin = (e) => {
    e.preventDefault();
    const username = nameInput.current.value.trim()
    // const userInfo = {id : uuidv4(), name}
    nameInput.current.value = ''
    if (username === '') {
      setErrorMessage('請務必輸入一個暱稱')
      return;
    }

    setUsername(username)
    socket.auth = { username }
    socket.connect()
    nameInput.current.value = ''
  }

  // function Sidebar ({users}) {
  //   const sendPrivateChat = (to, from, content) => {
  //     console.log('傳送',to, from, content);
  //     socket.emit("sendPrivateMessage", {to, from, content})
  //   }
  //   return (
  //     <div className='sidebar'>
  //       {users && users.map((onlineUser, index) => 
  //         <div key={onlineUser.id} className='user-item' onClick={() => sendPrivateChat(onlineUser.id, user.id,'hello this is private')}>
  //           <h2 style={{color: 'white'}}>{onlineUser.name}</h2>
  //           {/* <div className='status-container'>
  //             <div className='status-circle'></div>
  //             <div>online</div>
  //           </div> */}
  //         </div>
  //       )}
  //     </div>
  //   )
  // }

  useEffect(() => {
    socket.on('connect_error', (err) => {
      console.log(err);
      if (err.message === 'invalid username') {
        setUsername(null)
      }
    })

    return () => {
      socket.off("connect_error");
    }
  }, [])
  return (
    <>
      {username && <Chat />}
      {!username &&
        <div className='container'>
          <div className='login-wrap'>
            <form className='login-form' onSubmit={onLogin}>
              <input 
                type='text' 
                placeholder='輸入大名'
                className='username-input'
                ref={nameInput}
              />
              {errorMessage !== '' && <p>{errorMessage}</p>}
              <button type='submit' className='login-btn'>加入x天x</button>
            </form>
          </div>
        </div>
      }
    </>
  );
}

export default App;
