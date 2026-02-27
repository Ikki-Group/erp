export type StringOrNumber = string | number

export interface Option<TValue extends StringOrNumber> {
  label: string
  value: TValue
  [key: string]: any
}

export type OptionsWithData<TValue extends StringOrNumber, TData = any> = Array<
  Option<TValue> & {
    data: TData
  }
>
