import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const messagesData = [
  { id: 1, user: "Alice", text: "Hello everyone!" },
  { id: 2, user: "Bob", text: "Hi Alice, how are you?" },
  // more messages
];

export default function ChatWindow() {
  const [messages, setMessages] = useState(messagesData);
  const [newMessage, setNewMessage] = useState("");

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages([...messages, { id: Date.now(), user: "You", text: newMessage }]);
    setNewMessage("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campus Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
        {messages.map(msg => (
          <div key={msg.id} className={`p-2 rounded ${msg.user==="You"?"bg-blue-100 self-end":"bg-gray-200 self-start"}`}>
            <strong>{msg.user}:</strong> {msg.text}
          </div>
        ))}
        <div className="flex mt-2 gap-2">
          <Input value={newMessage} onChange={e=>setNewMessage(e.target.value)} placeholder="Type a message..." />
          <Button onClick={sendMessage}>Send</Button>
        </div>
      </CardContent>
    </Card>
  );
}
