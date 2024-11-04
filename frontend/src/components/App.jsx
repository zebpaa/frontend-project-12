/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Navbar, Container, Button } from "react-bootstrap";
import LoginPage from "./LoginPage";
import NotFoundPage from "./NotFoundPage";
import SignUpPage from "./SignUpPage";
import AuthContext from '../contexts/AuthContext';
import useAuth from '../hooks/index.jsx';
import HomePage from './HomePage.jsx';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../services/authSlice.js';
import socket from '../socket.js';
import { addChannel, removeChannel } from '../services/channelsSlice.js'
import { addMessage } from '../services/messagesSlice.js'

const AuthProvider = ({ children }) => {
    const hasToken = !!localStorage.getItem('token');
    const [loggedIn, setLoggedIn] = useState(hasToken);
    const dispatch = useDispatch();

    const logIn = () => setLoggedIn(true);
    const logOut = () => {
        localStorage.removeItem('username');
        localStorage.removeItem('token');
        dispatch(logoutUser());
        setLoggedIn(false);
    };

    useEffect(() => {
        const user = localStorage.getItem('username');
        const token = localStorage.getItem('token');
        user && token ? logIn() : logOut();
    }, []);

    return (
        <AuthContext.Provider value={{ loggedIn, logIn, logOut }}>
            {children}
        </AuthContext.Provider>
    );
};

const PrivateRoute = ({ children }) => {
    const auth = useAuth();
    const location = useLocation();

    return (
        auth.loggedIn ? children : <Navigate to="/login" state={{ from: location }} />
    );
}

const AuthButton = () => {
    const auth = useAuth();

    return (
        auth.loggedIn && <Button onClick={auth.logOut}>Выйти</Button>
    );
};

const App = () => {
    const dispatch = useDispatch();
    
    useEffect(() => {
        socket.on('newMessage', (payload) => {
            console.log(payload); // => { body: "new message", channelId: 7, id: 8, username: "admin" }
            dispatch(addMessage(payload));
        });
        socket.on('newChannel', (payload) => {
            console.log(payload) // { id: 6, name: "new channel", removable: true }
            dispatch(addChannel(payload));
        });
        socket.on('removeChannel', (payload) => {
            console.log(payload); // { id: 6 };
            dispatch(removeChannel(payload));
        });
        // socket.on('renameChannel', (payload) => {
        //     console.log(payload); // { id: 7, name: "new name channel", removable: true }
        // });

        return () => {
            socket.off('newMessage');
            socket.off('newChannel');
            socket.off('removeChannel');
            socket.off('renameChannel');
        };
    }, [dispatch]);

    return (
        <AuthProvider>
            <div className="d-flex flex-column h-100">
                <Router>
                    <Navbar expand="lg" className="shadow-sm bg-white">
                        <Container>
                            <Navbar.Brand href="/">Hexlet Chat</Navbar.Brand>
                            <AuthButton />
                        </Container>
                    </Navbar>

                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignUpPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                        <Route
                            path="/"
                            element={(
                                <PrivateRoute>
                                    <HomePage />
                                </PrivateRoute>
                            )}
                        />
                    </Routes>
                </Router>
            </div>
            <div className="Toastify"></div>
        </AuthProvider>
    );
}

export default App;