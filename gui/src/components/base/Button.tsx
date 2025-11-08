import { ComponentProps } from "react";

type RowProps = ComponentProps<"button"> & {
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  color?: "white" | "blue" | "green";
};

const classes = {
  size: {
    small: "px-2 py-1 text-sm",
    medium: "px-4 py-2 text-base",
    large: "px-6 py-3 text-lg",
  },
  color: {
    white: "bg-white hover:bg-gray-50",
    blue: "bg-blue-200 hover:bg-blue-400",
    green: "bg-green-200 hover:bg-green-400",
  },
} as const;

export function Button({ size = "medium", color = "white", fullWidth = false, ...props }: RowProps) {
  let className = `rounded ${classes.color[color]} ${classes.size[size]} font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 `;

  if (fullWidth) {
    className += " w-full";
  }

  return <button {...props} className={className} />;
}
