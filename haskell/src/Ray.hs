{-# LANGUAGE TemplateHaskell #-}

module Ray where

import           Control.Lens (makeLenses)

import           Types

data Ray = Ray
    { _rayStart     :: Vector
    , _rayDirection :: Vector
    }
makeLenses ''Ray

data RayHit = RayHit
    { _hitRay      :: Ray
    , _hitPoint    :: Vector
    , _hitNormal   :: Vector
    , _hitDistance :: Double
    }
makeLenses ''RayHit

class Intersectable a where
    intersects :: Ray -> a -> Maybe RayHit
