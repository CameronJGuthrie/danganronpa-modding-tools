import { ComponentProps } from "react";

type RowProps = ComponentProps<"div">;

export function Column(props: RowProps) {
  return <div {...props} className={`flex flex-col ${props.className ?? ""}`} />;
}
