module Main where

import Codec.Picture
import Data.Array.Repa hiding ((++))
import Linear.V3

import Lib
import Object
import Types
import Light

toImage :: Int -> Int -> Array U DIM2 RGB8 -> Image PixelRGB8
toImage w h a = generateImage gen w h
  where
    gen x y =
        let (r, g, b) = a ! (Z :. x :. y)
        in PixelRGB8 r g b

main :: IO ()
main = do
    (w, h) <- return (500, 500)
    img <- computeUnboxedP $ getImage (Scene w h os ls)
    savePngImage "test.png" . ImageRGB8 . (toImage w h) $ img

    where
        spheres = do
            i <- [-1..1]
            j <- [-1..1]
            return $ Sphere (V3 (150 * i) 50 (200 * j)) 50 (Material 0.8 (V3 (max 0 i) (max 0 j) (max 0 (i*j))) 0.2 0.2 20)

        os = spheres ++
            [
              Plane  (V3 0 100 0) (V3 0 (-1) 0) (Material 0.5 (V3 0.5 0.5 0.5) 0.5 0 0)
            ]

        ls =
            [ AmbientLight 0.1 (V3 0.05 0.05 0.05)
            , DirectionalLight 1 (V3 1 1 1) (V3 1 (-1) 0)
            , PointLight 3 (V3 1 1 1) (V3 1000 (-5000) 0)
            ]
