module Types where

import Linear.V3 (V3)
import Codec.Picture (Pixel8)

type Color = V3 Double -- Color as an RGB value between 0 and 1
type Vector = V3 Double

type RGB8 = (Pixel8, Pixel8, Pixel8)
