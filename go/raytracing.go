package main

import (
    "image"
    "image/color"
    "image/png"
    "os"
)

func main() {
    width := 500
    height := 500

    upLeft := image.Point{0, 0}
    lowRight := image.Point{width, height}
    img := image.NewRGBA(image.Rectangle{upLeft, lowRight})
    cyan := color.RGBA{100, 200, 200, 0xff}

    for x := 0; x < width; x++ {
        for y := 0; y < height; y++ {
            img.Set(x, y, cyan)
        }
    }

    // Encode as PNG.
    f, _ := os.Create("ouput.png")
    png.Encode(f, img)
}
