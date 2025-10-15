'use client';
import React from 'react';

interface ButtonProps {
    onClick?: () => void;
    children: React.ReactNode;
    type?: 'button' | 'submit';
    disabled?: boolean;
    className?: string;
}

const Button: React.FC<ButtonProps> = ({
                                           onClick,
                                           children,
                                           type = 'button',
                                           disabled = false,
                                           className = ''
                                       }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={className}
        style={{
            padding: '10px 20px',
            margin: '5px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: disabled ? '#9ca3af' : '#4f46e5',
            color: 'white',
            fontWeight: 'bold',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
        }}
    >
        {children}
    </button>
);

export default Button;