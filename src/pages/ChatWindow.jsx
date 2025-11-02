import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const messagesData = [
  { id: 1, user: "Alice", text: "Hello everyone!" },
  { id: 2, user: "Bob", text: "Hi Alice, how are you?" },
  // more messages
];

export { default } from './Messages';
