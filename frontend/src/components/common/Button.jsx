const Button = ({ children, className = "", variant = "primary", ...props }) => {
  return (
    <button className={`btn btn-${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
};

export default Button;
