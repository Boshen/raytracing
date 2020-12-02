{-# LANGUAGE TemplateHaskell #-}

module Light where

import Control.Lens

import Types

data Light =
    AmbientLight
    { _radiance :: Double -- [0, inf)
    , _lightColor :: Color -- c_l
    }
    | DirectionalLight
    { _radiance :: Double -- l_s
    , _lightColor :: Color -- c_l
    , _lightDirection :: Vector
    }
    | PointLight
    { _radiance :: Double
    , _lightColor :: Color
    , _lightLocation :: Vector
    }
makeLenses ''Light
