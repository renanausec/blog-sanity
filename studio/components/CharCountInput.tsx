import { Card, Stack, Text } from '@sanity/ui'
import type { ComponentType } from 'react'
import type { StringInputProps, TextInputProps } from 'sanity'

/**
 * Eingabefeld mit Zeichenzähler (für Meta-Title und Meta-Description).
 * Färbt den Zähler gelb, wenn die empfohlene Länge unter- oder überschritten wird.
 */
export function charCountInput(min: number, max: number): ComponentType<StringInputProps | TextInputProps> {
  function CharCountInput(props: StringInputProps | TextInputProps) {
    const length = props.value?.length ?? 0
    const tone = length === 0 ? 'transparent' : length < min || length > max ? 'caution' : 'positive'
    return (
      <Stack gap={2}>
        {props.renderDefault(props)}
        <Card tone={tone} padding={2} radius={2}>
          <Text size={1}>
            {length} Zeichen · empfohlen {min}–{max}
          </Text>
        </Card>
      </Stack>
    )
  }
  return CharCountInput
}
