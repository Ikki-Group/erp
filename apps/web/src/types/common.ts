export type StringOrNumber = string | number

export interface Option<V extends StringOrNumber> {
  label: string
  value: V
  [key: string]: any
}

export type OptionsWithData<V extends StringOrNumber, D = any> = (Option<V> & {
  data: D
})[]
