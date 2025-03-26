import React from "react";
import Button from "@mui/material/Button";
// import PropTypes from "prop-types";
import colors from "./colors";

interface CustomButtonProps {
  variant?: "text" | "outlined" | "contained";
  color?: "inherit" | "primary" | "secondary" | "error" | "success" | "info" | "warning";
  size?: "small" | "medium" | "large";
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void; // Update type here
  children: React.ReactNode;
  disabled?: boolean;
  startIcon: any;
  sx?: any;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  variant = "outlined",
  color = "primary",
  size = "medium",
  onClick,
  children,
  disabled,
  sx,
}) => {
  return (
    <Button
      variant={variant}
      color={color}
      size={size}
      onClick={onClick}
      disabled={disabled}
      sx={{
        height: "35px",
        borderRadius: "10px", // Slightly more rounded for a subtle 3D effect
        border: variant === "outlined" ? `2px solid ${colors.yellow}` : "none", // Border for outlined variant
        backgroundColor:
          variant === "contained" ? colors.yellow : "transparent", // Background color for contained variant
        color: variant === "contained" ? "#fff" : colors.darkblue, // Text color for contained variant
        padding: "8px 16px",
        fontSize: "12px", // Adjusted font size for better readability
        textTransform: "uppercase",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)", // Subtle shadow for 3D effect
        transition: "all 0.3s ease",
        "&:hover": {
          borderColor: "#FF9F00", // Darker border color on hover for outlined variant
          backgroundColor: variant === "contained" ? "#FF9F00" : "#FFF7E0", // Darker background color for contained variant
          color: variant === "contained" ? "#fff" : "#FF9F00", // Text color on hover for contained variant
          boxShadow: "0 6px 12px rgba(0, 0, 0, 0.3)", // Increased shadow on hover for a deeper 3D effect
        },
        marginRight: '10px',
        marginTop: '10px',
      }}
    >
      {children}
    </Button>
  );
};


export default CustomButton;
