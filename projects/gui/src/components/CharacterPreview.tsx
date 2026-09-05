import { useState } from "react";
import { Character, useCharacters } from "../data/character";
import { SpriteMeta, useCharacterSprites, useSelectedCharacterSprite } from "../data/sprite";
import { Button } from "./base/Button";
import { Column } from "./base/Column";
import { Row } from "./base/Row";
import { TgaImage } from "./TgaImage";

// TODO: Make this configurable via settings or file dialog
// Note: process.env is not available in renderer - would need to use import.meta.env with Vite
const EXTRACTED_DIR = null;

function getSpritePath(sprite: SpriteMeta) {
  if (!sprite || !EXTRACTED_DIR) {
    return null;
  }
  return EXTRACTED_DIR + sprite.path;
}

export function CharacterPreview() {
  const [selectedCharacter, setSelectedCharacter] = useState<Character["name"]>("Makoto");
  const [selectedSprite, setSelectedSprite] = useSelectedCharacterSprite(selectedCharacter);

  const characters = useCharacters();
  const sprites = useCharacterSprites(selectedCharacter);
  const filePath = getSpritePath(selectedSprite);

  return (
    <Row className="p-4 gap-4">
      <Column className="w-32 gap-4">
        <strong>Character</strong>
        <ul className="list-none">
          {Object.values(characters).map(({ name }, index) => {
            const isOdd = index % 2 === 0;
            const isSelected = name === selectedCharacter;

            let buttonClass = "";
            let listItemClass = "";

            if (isSelected) {
              buttonClass += "";
              if (isOdd) {
                listItemClass += " rotate-6 py-1";
              } else {
                listItemClass += " -rotate-6 py-1";
              }
            }

            return (
              <li key={name} className={listItemClass}>
                <Button fullWidth className={buttonClass} onMouseEnter={() => setSelectedCharacter(name)}>
                  {isSelected ? <strong>{name}</strong> : name}
                </Button>
              </li>
            );
          })}
        </ul>
      </Column>
      <Column className="w-64 gap-4">
        <strong>Sprites</strong>
        {!sprites.length && <p>No sprites found</p>}
        <ul className="list-none">
          {Object.values(sprites).map((sprite, index) => {
            const isSelected = sprite.path === selectedSprite?.path;
            const isOdd = index % 2 === 0;

            let listItemClass = "";

            if (isSelected) {
              if (isOdd) {
                listItemClass += " rotate-3 py-1";
              } else {
                listItemClass += " -rotate-3 py-1";
              }
            }

            return (
              <li key={`${sprite.path}`} className={listItemClass}>
                <Button fullWidth onMouseEnter={() => setSelectedSprite(sprite)}>
                  {isSelected ? <strong>{sprite.name}</strong> : sprite.name}
                </Button>
              </li>
            );
          })}
        </ul>
      </Column>
      <Column className="w-auto gap-4">
        <strong>Preview</strong>
        <code>{filePath}</code>
        <TgaImage filePath={filePath} width={512} height={1024} />
      </Column>
    </Row>
  );
}
