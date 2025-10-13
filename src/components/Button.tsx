'use client';
import React from 'react';

interface ButtonProps {
    onClick?: () => void;
    children: React.ReactNode;
    type?: 'button' | 'submit';
}

const Button: React.FC<ButtonProps> = ({ onClick, children, type = 'button' }) => (
    <button
        type={type}
        onClick={onClick}
        style={{
            padding: '10px 20px',
            margin: '5px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: '#4f46e5',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
        }}
    >
        {children}
    </button>
);

export default Button;
