import React, { useState, useEffect } from "react";
import axios from "axios";


type User = {
  name: {
    title: string;
    first: string;
    last: string;
  };
  email: string;
};

const UserDetails: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const response = await axios.get("https://randomuser.me/api/");
      const userData = response.data.results[0];
      const { name, email } = userData;
      setUser({ name, email });
      localStorage.setItem("user", JSON.stringify({ name, email }));
    };

    fetchUser();
  }, []);

  return (
    <>
      {user && (
        <>
          <h1>
            {user.name.title} {user.name.first} {user.name.last}
          </h1>
          <p>{user.email}</p>
        </>
      )}
    </>
  );
};

export default UserDetails;
