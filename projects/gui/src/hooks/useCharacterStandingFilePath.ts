import { useAppContext } from "../state/AppContext";

const useCharacterStandingFilePath = () => {
  const { characterStandingSpriteFilePath, setCharacterStandingSpriteFilePath } = useAppContext();

  return {
    characterStandingSpriteFilePath,
    setCharacterStandingSpriteFilePath,
  };
};

export default useCharacterStandingFilePath;
