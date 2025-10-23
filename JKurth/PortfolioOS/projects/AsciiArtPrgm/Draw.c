/*
CS1142
Author: Jack Kurth
USERNAME: jmkurth

creates an ASCII image by following a sequence of instructions read in from standard input.

*/

#include <stdio.h>
#include <stdlib.h>
#include <math.h>




// Initializes all the pixels of an image to black.
void initImage(int width, int height, double image[width][height])
{
    for (int x = 0; x < width; x++)
    {
        for (int y = 0; y < height; y++)
        {
            image[x][y] = 0.0;
        }
    }
}

// Helper method I put in to help with returning the correct char 
char getAsciiForPixel(double pixel) {
    if (pixel < 0.1)      return ' ';
    else if (pixel < 0.2) return '.';
    else if (pixel < 0.3) return ':';
    else if (pixel < 0.4) return '-';
    else if (pixel < 0.5) return '=';
    else if (pixel < 0.6) return '+';
    else if (pixel < 0.7) return '*';
    else if (pixel < 0.8) return '#';
    else if (pixel < 0.9) return '%';
    else                  return '@';
}

// TODO: add a parameter list and implementation for the remaining functions.
// Check the calls in the main function to figure out the order and types of 
// the parameters that are passed to each function.

void printImage(int width, int height, double image[width][height])
{
    // Print top border
    putchar('+');
    for (int x = 0; x < width; x++) {
        putchar('-');
    }
    putchar('+');
    putchar('\n');

    // Print each row of pixels
    for (int y = 0; y < height; y++) {
        putchar('|');
        for (int x = 0; x < width; x++) {
            putchar(getAsciiForPixel(image[x][y]));
        }
        putchar('|');
        putchar('\n');
    }

    // Print bottom border
    putchar('+');
    for (int x = 0; x < width; x++) {
        putchar('-');
    }
    putchar('+');
    putchar('\n');

}

void drawPoint(int width, int height, double image[width][height], int x, int y, double color)
{
    if (x >= 0 && x < width && y >= 0 && y < height) {
        image[x][y] = color;
    }
}

void drawRectangle(int width, int height, double image[width][height], int left, int top, int rectangleWidth, int rectangleHeight, double color)
{
    if (rectangleWidth <= 0 || rectangleHeight <= 0)
        return;
        
    for (int x = left; x < left + rectangleWidth; x++) {
        for (int y = top; y < top + rectangleHeight; y++) {
            drawPoint(width, height, image, x, y, color);
        }
    }
}

void convertToBlackAndWhite(int width, int height, double image[width][height], double threshold)
{
    for (int x = 0; x < width; x++) {
        for (int y = 0; y < height; y++) {
            if (image[x][y] >= threshold)
                image[x][y] = 1.0;
            else
                image[x][y] = 0.0;
        }
    }
}

void drawLine(int width, int height, double image[width][height], int x1, int y1, int x2, int y2, double color)
{
    double dx = x2 - x1;
    double dy = y2 - y1;
    int steps = (int)(fabs(dx) > fabs(dy) ? fabs(dx) : fabs(dy));
    if (steps == 0) {
        drawPoint(width, height, image, x1, y1, color);
        return;
    }
    double xIncrement = dx / steps;
    double yIncrement = dy / steps;
    double x = x1;
    double y = y1;
    for (int i = 0; i <= steps; i++) {
        drawPoint(width, height, image, (int)round(x), (int)round(y), color);
        x += xIncrement;
        y += yIncrement;
    }
}

void printStats(int width, int height, double image[width][height])
{
    double min = image[0][0], max = image[0][0], sum = 0.0;
    int total = width * height;
    for (int x = 0; x < width; x++) {
        for (int y = 0; y < height; y++) {
            double val = image[x][y];
            if (val < min) min = val;
            if (val > max) max = val;
            sum += val;
        }
    }
    double mean = sum / total;
    
    double varianceSum = 0.0;
    for (int x = 0; x < width; x++) {
        for (int y = 0; y < height; y++) {
            double diff = image[x][y] - mean;
            varianceSum += diff * diff;
        }
    }
    double sd = sqrt(varianceSum / total);
    
    printf("Color range [%.2f, %.2f], mean %.4f, sd %.4f\n", min, max, mean, sd);
}

// HELPER method for the Floodfill method
void floodFillRecursive(int width, int height, double image[width][height],
                        int x, int y, double fillColor)
{
    // Check if (x, y) is outside the image boundaries.
    if (x < 0 || x >= width || y < 0 || y >= height)
        return;
    
    // Stop filling if the pixel is already as dark as or darker than the fill color.
    if (image[x][y] >= fillColor)
        return;
    
    // Set the pixel to the fill color.
    image[x][y] = fillColor;
    
    // Recursively flood fill in the four directions.
    floodFillRecursive(width, height, image, x + 1, y, fillColor);
    floodFillRecursive(width, height, image, x - 1, y, fillColor);
    floodFillRecursive(width, height, image, x, y + 1, fillColor);
    floodFillRecursive(width, height, image, x, y - 1, fillColor);
}

void floodFill(int width, int height, double image[width][height], int x, int y, double color)
{
    if (x < 0 || x >= width || y < 0 || y >= height)
        return;
    if (image[x][y] >= color)
        return;
    
    floodFillRecursive(width, height, image, x, y, color);
}

// Print the resulting greyscale image as ASCII art.
// You need to fix the lines marked with TODO comments to read input from standard input.
// Do not change other things in the main function.
int main(void)
{
    // Read in the size of the drawing canvas
    int width = 0;
    int height = 0;
        
    // TODO: replace 0 with a call to scanf that reads in both the width and height.
    // The scanf function returns an integer with the number of read in variables.
    // The main program uses this result to check for badly formatted input.
    // The scanf function can read in multiple variables in one call (see the lecture slides).
    int result = scanf("%d %d", &width, &height);
    
    // Program only supports images that are 1x1 or bigger
    if ((width <= 0) || (height <= 0) || (result != 2))
    {
        printf("Failed to read a valid width and height from standard input!\n");
        return 0;
    }
    
    // Create the 2D array and initialize all the greyscale values to 0.0.
    // The first dimension is the x-coordinate.
    // The second dimension is the y-coordinate.
    double image[width][height];
    initImage(width, height, image);
    
    char command = '\0';
    double color = 0.0;
    
    // Keep reading in drawing commands until we reach the end of the input
    while (scanf(" %c", &command) == 1)
    {
        switch (command)
        {		
            case 'p': 	
            {
                // Draw a point, read in: x, y, color
                int x = 0;
                int y = 0;
                result = scanf("%d %d %lf", &x, &y, &color); // TODO: fix
                if (result != 3)
                {
                    printf("Invalid point command!\n");
                    return 0;
                }
                drawPoint(width, height, image, x, y, color);
                break;
            }
            case 'r': 	
            {
                // Draw a rectangle, read in: x, y, w, h, color
                int left = 0;
                int top = 0;
                int rectangleWidth = 0;
                int rectangleHeight = 0;
                result = scanf("%d %d %d %d %lf", &left, &top, &rectangleWidth, &rectangleHeight, &color); // TODO: fix
                if (result != 5)
                {
                    printf("Invalid rectangle command!\n");
                    return 0;
                }
                drawRectangle(width, height, image, left, top, rectangleWidth, rectangleHeight, color);
                break;
            }
            case 'b':   
            {
                // Convert to black and white
                double threshold = 0.0;
                result = scanf("%lf", &threshold); // TODO: fix
                if (result != 1)
                {
                    printf("Invalid black and white command!\n");
                    return 0;
                }
                convertToBlackAndWhite(width, height, image, threshold);
                break;
            }

            case 'l':
            {
                // Draw a line, read in x1, y1, x2, y2, color
                int x1 = 0;
                int y1 = 0;
                int x2 = 0;
                int y2 = 0;      
                result = scanf("%d %d %d %d %lf", &x1, &y1, &x2, &y2, &color); // TODO: fix
                if (result != 5)
                {
                    printf("Invalid line command!\n");
                    return 0;
                }
                drawLine(width, height, image, x1, y1, x2, y2, color);
                break;
            }            
            case 'f':
            {
                // Flood fill a color in, read in: x, y, color
                int x = 0;
                int y = 0;
                result = scanf("%d %d %lf", &x, &y, &color); // TODO: fix
                if (result != 3)
                {
                    printf("Invalid flood fill command!\n");
                    return 0;
                }
                floodFill(width, height, image, x, y, color);
                break;
            }
            default:
            {
                printf("Unknown command!\n");
                return 0;
            }
        }
    }
	
    // Print the final image
    printImage(width, height, image);
    
    // Finally display some statistics about the image
    printStats(width, height, image);

    return 0;
}
