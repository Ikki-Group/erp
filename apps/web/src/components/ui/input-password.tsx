import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "./input-group";
import type { ComponentProps} from "react";

export function InputPassword({
  placeholder = "Masukkan kata sandi...",
  ...props
}: ComponentProps<"input">) {
  const [visible, setVisible] = useState(false);

  return (
    <InputGroup>
      <InputGroupInput type={visible ? "text" : "password"} placeholder={placeholder} {...props} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          onClick={() => setVisible(!visible)}
          variant="ghost"
          size="icon-sm"
        >
          {visible ? <EyeIcon /> : <EyeOffIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
