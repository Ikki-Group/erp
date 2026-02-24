import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Field } from "@/components/ui/field"

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"]

export function Pattern() {
  return (
    <Field className="max-w-xs">
      <Combobox items={frameworks}>
        <ComboboxInput placeholder="Select a framework" />
        <ComboboxContent>
          <ComboboxEmpty>No items found.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  )
}