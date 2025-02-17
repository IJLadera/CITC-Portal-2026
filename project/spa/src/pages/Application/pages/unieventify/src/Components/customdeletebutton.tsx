import React from "react";
import Button from "@mui/material/Button";
import PropTypes from "prop-types";

interface CustomDeleteButtonProps {
  variant?: "text" | "outlined" | "contained";
  color?: "inherit" | "primary" | "secondary" | "error" | "success" | "info" | "warning";
  size?: "small" | "medium" | "large";
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

const CustomDeleteButton: React.FC<CustomDeleteButtonProps> = ({
  variant = "outlined",
  color = "error",
  size = "medium",
  onClick,
  children,
  disabled,
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
        borderRadius: "10px",
        padding: "8px 16px",
        fontSize: "12px",
        textTransform: "uppercase",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
        transition: "all 0.3s ease",
        backgroundColor: variant === "contained" ? "#D32F2F" : "transparent",
        border: variant === "outlined" ? "2px solid #D32F2F" : "none",
        color: variant === "contained" ? "#fff" : "#D32F2F",
        "&:hover": {
          boxShadow: "0 6px 12px rgba(0, 0, 0, 0.4)",
          backgroundColor: variant === "contained" ? "#C62828" : "#FFEBEE",
          borderColor: variant === "outlined" ? "#C62828" : "transparent",
          color: variant === "contained" ? "#fff" : "#C62828",
        },
        marginRight: "10px",
        marginTop: "10px",
      }}
    >
      {children}
    </Button>
  );
};

// Workaround: Cast PropTypes.node to the expected type
CustomDeleteButton.propTypes = {
  variant: PropTypes.oneOf(["text", "outlined", "contained"]),
  color: PropTypes.oneOf([
    "inherit",
    "primary",
    "secondary",
    "error",
    "success",
    "info",
    "warning",
  ]),
  size: PropTypes.oneOf(["small", "medium", "large"]),
  onClick: PropTypes.func,
  children: PropTypes.node as React.Validator<React.ReactNode>, // Explicit cast
  disabled: PropTypes.bool,
};

export default CustomDeleteButton;