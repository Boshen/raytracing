{-# LANGUAGE TemplateHaskell #-}

module Object where

import           Control.Lens  (makeLenses)
import           Linear.Metric
import           Linear.Vector

import           Ray
import           Types

data Material = Material
    { _diffuseReflection :: Double -- k_d in [0, 1], == ka, ambient reflection coefficient
    , _diffuseColor      :: Color -- c_d; rho_d = k_d * c_d
    , _reflection        :: Double -- [0, 1]
    , _specularRefection :: Double -- k_s [0, 1]
    , _shininess         :: Double -- [0, inf)
    }
    deriving (Eq)
makeLenses ''Material

data Object = Plane
    { _position    :: Vector
    , _planeNormal :: Vector
    , _material    :: Material
    }
    | Sphere
    { _position :: Vector
    , _radius   :: Double
    , _material :: Material
    }
    deriving (Eq)
makeLenses ''Object

instance Intersectable Object where
    intersects ray@(Ray s dir) (Plane p n _)
        | dist <= 0 = Nothing
        | otherwise = Just $ RayHit ray hp n dist
        where
            dist = ((p - s) `dot` n) / (dir `dot` n)
            hp = s + dist *^ dir

    intersects ray@(Ray s dir) (Sphere p r _)
        | null roots = Nothing
        | otherwise = Just $ RayHit ray hp n dist
        where
            d = s - p -- discriminant
            roots = filter (> 10**(-6)) $ solveq (dir `dot` dir, 2 * dir `dot` d, d `dot` d - r * r)
            dist = minimum roots
            hp = s + dist *^ dir
            n = normalize $ hp - p

solveq :: (Double, Double, Double) ->[Double]
solveq (a, b, c)
    | d < 0 = []
    | d > 0 = [(-b - sqrt d) / (2 * a), (-b + sqrt d) / (2 * a)]
    | otherwise = [-b / (2 * a)]
    where
        d = b * b - 4 * a * c
