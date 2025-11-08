# ToDo List

### VS Code Extension

 - Confirm whether it is correct to show characters names in cases of `EvaluateFlag` (might be object ids)
 - Investigate `ShowBackground` opcode 
 - Investigate `LoadSprite` opcode
 - Investigate `LoadMap` opcode (see Spiral, it had some more info)
 - Investigate `Sprite` opcode args (see Spiral, it had some more info)
 - Investigate `Background` opcode args
 - Investigate `ChangeUI` when args are 0,x
 - Investigate `ChangeUI` when args are 15,x,x (previously assumed to mean GameMode)
 - Improve printing for `ScreenFade`
 - Improve printing for `ChangeUI`
 - Improve printing for `Sprite`
 - Improve printing for TruthBulletFlag (add colors)

 - ***feature*** Ctrl+Click to sprite image
 - ***feature*** Ctrl+Click to background image

#### Done
 - ~~***feature*** Hotkey for toggling parameter decorations~~
 - ~~***feature*** Hotkey for toggling function decorations~~
 - ~~Improve printing for `Sound` (max value 65536)~~
 - ~~Investigate `AddTruthBullet` opcode (link to enum)~~
 - ~~Improve printing for `Speaker`~~


### Compiler / Decompiler

 - Investigate concept: Automatically insert newlines in text.

#### Done

 - ~~Reduce clutter by automating the `TextStyle`, `WaitInput`, `WaitFrame` calls using just the `Text` opcode.~~

