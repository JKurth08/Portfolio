// Takes an image file and converts it into a file that can be
// displayed as ASCII art using the Draw program.
import java.awt.*;

public class ConvertToArt
{

    public static void main(String[] args)
    {
        if (args.length < 1)
        {
            System.out.println("Usage: java ConvertToArt <image filename>");
        }
        else
        {
            Picture pic = new Picture(args[0]);

            // Output the width and height of the image
            System.out.printf("%d %d\n", pic.width(), pic.height());
            for (int y = 0; y < pic.height(); y++)
            {
                for (int x = 0; x < pic.width(); x++)
                {
                    Color c = pic.get(x, y);
                    int r = c.getRed();
                    int g = c.getGreen();
                    int b = c.getBlue();

                    // Convert RGB value to greyscale
                    double grey = 0.299 * r/255.0 + 0.587 * g/255.0 + 0.114 * b/255.0;
                    System.out.printf("p %d %d %.1f\n", x, y, grey);          
                }
            }        
        }
    }

}
