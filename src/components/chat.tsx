import React, { Fragment, useEffect, useState } from 'react'
import CryptoJS from "crypto-js";


const Chat = ({ socket, username, room }: any) => {

    const secretPass = "XkhZG4fW2t2W";

    const [currentMessage, setCurrentMessage] = useState<string>("");
    const [messageList, setMessageList] = useState<any>([]);
    const [isTyping, setIsTyping] = useState(false)
    const [userOnlineStatus, setUserOnlineStatus] = useState("")

    const sendMessage = async () => {
        if (currentMessage !== "") {

            const data = CryptoJS.AES.encrypt(
                JSON.stringify(currentMessage),
                secretPass
            ).toString();

            const messageData = {
                room: room,
                author: username,
                message: data,
                time:
                    new Date(Date.now()).getHours() +
                    ":" +
                    new Date(Date.now()).getMinutes(),
            };
            await socket.emit("send_message", messageData);

            const bytes = CryptoJS.AES.decrypt(messageData.message, secretPass);
            var originalText = bytes.toString(CryptoJS.enc.Utf8);

            messageData.message = originalText.replace(/['"]+/g, '')

            setMessageList((oldMsg: any) => [...oldMsg, messageData])
            setCurrentMessage("");
        }
    };

    useEffect(() => {
        socket.on("receive_message", (data: any) => {
            let newMsg = data;

            const bytes = CryptoJS.AES.decrypt(newMsg.message, secretPass);
            var originalText = bytes.toString(CryptoJS.enc.Utf8);
            newMsg.message = originalText.replace(/['"]+/g, '');
            setMessageList((oldMsg: any) => [...oldMsg, newMsg])
        });

        return () => {
            socket.off("receive_message").off();
        }
    }, [socket]);


    useEffect(() => {
        socket.on("typing", (data: any) => {
            console.log(data);

            setIsTyping(data.status)
        })
        return () => {
            socket.off("typing").off();
        }
    }, [])

    useEffect(() => {
        socket.on("online", (data: any) => {
            console.log(data);

            setUserOnlineStatus(data.status)
        })
        return () => {
            socket.off("online").off();
        }
    }, [])

    useEffect(() => {
        socket.on("offline", (data: any) => {
            console.log(data);
            setUserOnlineStatus(data.status)
        })
        return () => {
            socket.off("offline").off();
        }
    }, [])





    const handelTyping = (event: any) => {
        let timer;
        clearTimeout(timer);
        setCurrentMessage(event.target.value);

        if (!isTyping) socket.emit("user_typing", { room: room, status: true })

        timer = setTimeout(() => {
            socket.emit("user_typing", { room: room, status: false })
        }, 3000)
    }

    const handelOffline = () => {
        socket.emit("user_offline", { room: room, status: `${username} is Offline` })
    }

    const handelOnline = () => {
        socket.emit("user_online", { room: room, status: `${username} is Online` })
    }

    useEffect(() => {
        console.log(messageList);
    }, [messageList])



    return (
        <Fragment>
            <div>UserName : {username} || Room Name: {room}</div>

            <button onClick={() => { handelOffline() }}>Go Offline</button>
            <button onClick={() => { handelOnline() }}>Go Online</button>

            <p>{userOnlineStatus}</p>
            {
                messageList?.map((item: any, index: any) => {
                    if (item.author === username) {
                        return (
                            <div className="container">
                                <img src="https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/avatars/d9/d9b2f26ceb2640721e423ad3645a29231db4f392.jpg" alt="Avatar" style={{ width: '100%' }} />
                                <p className='msg'>{item.message}</p>
                                <span className="time-right">{item.time}</span>
                            </div>

                        )
                    } else {
                        return (
                            <div className="container darker">
                                <img src="https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/avatars/f5/f56665e65a615ba3a9a540225e56a1c3e67f6eb8.jpg" alt="Avatar" className="right" style={{ width: '100%' }} />
                                <p className='msg'>{item.message}</p>
                                <span className="time-left">{item.time}</span>
                            </div>
                        )
                    }
                })
            }

            {isTyping && <>Typing...</>}

            <div className='msgBoxContainer'>
                <input
                    type="text"
                    className='msgBox'
                    value={currentMessage}
                    placeholder="Hey..."
                    onChange={(event) => {
                        handelTyping(event);

                    }}
                    onKeyPress={(event) => {
                        event.key === "Enter" && sendMessage();
                    }}
                />
                <button onClick={sendMessage}>&#9658;</button>
            </div>

        </Fragment>
    )
}

export default Chat