import { io } from "socket.io-client";

const URL = "http://localhost:4001"
const socket = io(URL, { autoConnect: false })


export default socket;