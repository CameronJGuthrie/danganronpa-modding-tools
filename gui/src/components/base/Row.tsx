import { ComponentProps } from "react";

type RowProps = ComponentProps<"div">;

export function Row(props: RowProps) {
  return <div {...props} className={`flex flex-row ${props.className ?? ""}`} />;
}
