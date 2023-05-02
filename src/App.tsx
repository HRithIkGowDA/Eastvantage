import React, { useState } from "react";
import UserDetails from "./UserDetails";
import "./styles.css";

const App: React.FC = () => {
  const [key, setKey] = useState(0);

  const refreshUser = () => {
    setKey(key + 1);
  };

  return (
    <>
      <UserDetails key={key} />
      <button onClick={refreshUser}>Refresh</button>
    </>
  );
};

export default App;
