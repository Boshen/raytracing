{-# LANGUAGE TemplateHaskell #-}
{-# LANGUAGE TypeOperators   #-}

module Lib where

import Control.Lens
import Control.Applicative
import Data.Foldable
import Data.Maybe
import Data.Ord
import Linear.Metric
import Linear.V3
import Linear.Vector
import Data.Array.Repa (Array, DIM2, D, Z (..), (:.)(..))
import qualified Data.Array.Repa as R

import Types
import Object
import Ray
import Light

eye, lookat, uu, vv, ww :: Vector
eye = V3 0 (-100) 500
lookat = V3 0 0 (-50)
ww = normalize $ eye - lookat
vv = V3 0 1 0
uu = normalize $ vv `cross` ww

viewDistance :: Double
viewDistance = 400

data Scene = Scene
    { _width :: Int
    , _height :: Int
    , _objects :: [Object]
    , _lights :: [Light]
    }
makeLenses ''Scene

getImage :: Scene -> Array D DIM2 RGB8
getImage scene = R.fromFunction (Z :. (scene^.width) :. (scene^.height)) $ getPixel scene

getPixel :: Scene -> (Z :. Int :. Int) -> RGB8
getPixel scene (Z :. j :. i) = (r, g, b)
    where
        (i', j') = (fromIntegral i, fromIntegral j)
        (w', h') = (fromIntegral $ scene^.width, fromIntegral $ scene^.height)
        x = j' - h' / 2.0
        y = i' - w' / 2.0
        n = 5 -- sample points for anti-aliasing
        samples = [((x' + 0.5) / n, (y' + 0.5) / n) | x' <- [0..n-1], y' <- [0..n-1]]
        colors = getSample scene (x, y) <$> samples
        (V3 r g b) = max 0 . round . min 255 . (*255) . (/(n * n)) <$> sum colors

getSample :: Scene -> (Double, Double) -> (Double, Double) -> Color
getSample scene (x, y) (dx, dy) = trace scene (Ray eye d) 1 (V3 0 0 0)
    where
        x' = x + dx
        y' = y + dy
        d = normalize $ (x' *^ uu) + (y' *^ vv) - (viewDistance *^ ww)

trace :: Scene -> Ray -> Int -> Color -> Color
trace scene ray depth color = case minIntersect ray (scene^.objects) of
    Nothing -> V3 0 0 0
    Just (object, rayHit) -> shadeColor + reflectionColor
        where
            shadeColor = sum $ calcShade scene object rayHit <$> (scene^.lights)
            reflectionColor = calcReflection scene object ray rayHit depth color

calcReflection :: Scene -> Object -> Ray -> RayHit -> Int -> Color -> Color
calcReflection scene object ray rayHit depth color
    | depth >= 15 = color
    | reflect == 0 = color
    | otherwise =  reflect *^ reflectColor + color
    where
        reflect = object^.material^.reflection
        reflectDir = 2 * ((ray^.rayDirection) `dot` (rayHit^.hitNormal))
        reflectRay = Ray (rayHit^.hitPoint) ((ray^.rayDirection) - (reflectDir *^ (rayHit^.hitNormal)))
        reflectColor = trace scene reflectRay (depth + 1) color

calcShade :: Scene -> Object -> RayHit -> Light -> Color
calcShade scene object (RayHit (Ray s _) p n _) light = case light of
    AmbientLight l_s c_l ->
        (k_d *^ c_d) * (l_s *^ c_l)

    DirectionalLight l_s c_l l ->
        (k_d *^ c_d ^/ 3.14) ^* (max 0 $ n `dot` l) * (l_s *^ c_l)

    PointLight l_s c_l lightPos -> if inShadow then V3 0 0 0 else diffuse + specular
        where
            l = normalize $ lightPos - p -- light direction
            w = normalize $ s - p -- view direction

            -- when the object is blocked by another object
            shadowRay = Ray (p + 0.001 *^ l) l
            os = filter (/= object) (scene^.objects)
            inShadow = (n `dot` w > 0) && (any isJust $ intersects shadowRay <$> os)

            -- Lambertian shading model
            diffuseAmount = max 0 $ n `dot` l
            diffuse = (k_d *^ c_d ^/ 3.14) ^* diffuseAmount * (l_s *^ c_l)

            -- Phong shading model
            k_s = object^.material^.specularRefection
            e = object^.material^.shininess
            r = 2 * diffuseAmount *^ n - l -- reflection direction
            specularAmount = r `dot` w
            specular = k_s * (specularAmount ** e) * diffuseAmount *^ (l_s *^ c_l)

    where
        k_d = object^.material^.diffuseReflection
        c_d = object^.material^.diffuseColor

minIntersect :: Intersectable a => Ray -> [a] -> Maybe (a, RayHit)
minIntersect ray os
    | null os = Nothing
    | null hits = Nothing
    | otherwise = Just $ minimumBy (comparing $ view hitDistance . snd) hits
        where
            maybeHits = intersects ray <$> os
            hits = catMaybes $ zipWith (liftA2 (,) . Just) os maybeHits
