# -*- coding: utf-8 -*-
# Copyright (c) 2003, Taro Ogawa.  All Rights Reserved.
# Copyright (c) 2013, Savoir-faire Linux inc.  All Rights Reserved.
# Copyright (c) 2020, Michael hansen  All Rights Reserved.

# This library is free software; you can redistribute it and/or
# modify it under the terms of the GNU Lesser General Public
# License as published by the Free Software Foundation; either
# version 2.1 of the License, or (at your option) any later version.
# This library is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
# Lesser General Public License for more details.
# You should have received a copy of the GNU Lesser General Public
# License along with this library; if not, write to the Free Software
# Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
# MA 02110-1301 USA

import math
import unittest
from decimal import Decimal

swOnes = [
    "sifuri",  # 0
    "moja",  # 1
    "mbili",  # 2
    "tatu",  # 3
    "nne",  # 4
    "tano",  # 5
    "sita",  # 6
    "saba",  # 7
    "nane",  # 8
    "tisa",  # 9
]

swTens = [
    "",
    "kumi",  # 10
    "ishirini",  # 20
    "thelathini",  # 30
    "arobaini",  # 40
    "hamsini",  # 50
    "sitini",  # 60
    "sabini",  # 70
    "themanini",  # 80
    "tisini",  # 90
]

swBig = [
    "",
    "",
    "mia",  # 1e2
    "elfu",  # 1e3
    "",
    "laki",  # 1e5
    "milioni",  # 1e6
    "",
    "",
    "bilioni",  # 1e9
]

swSeparator = "na"
swOrdinal = "wa"
swDecimalPoint = "nukta"


class Num2Word_SW(object):
    errmsg_too_big = "Too large"
    max_num = 10 ** 36

    def float2tuple(self, value):
        pre = int(value)

        # Simple way of finding decimal places to update the precision
        self.precision = abs(Decimal(str(value)).as_tuple().exponent)

        post = abs(value - pre) * 10 ** self.precision
        if abs(round(post) - post) < 0.01:
            # We generally floor all values beyond our precision (rather than
            # rounding), but in cases where we have something like 1.239999999,
            # which is probably due to python's handling of floats, we actually
            # want to consider it as 1.24 instead of 1.23
            post = int(round(post))
        else:
            post = int(math.floor(post))

        return pre, post, self.precision

    def cardinalPos(self, number):
        if number < 10:
            # Zero is handled elsewhere
            return swOnes[number]

        if number < 100:
            x, y = divmod(number, 10)
            words = [swTens[x]]
            if y != 0:
                words.append(swSeparator)
                words.append(swOnes[y])

            return " ".join(words)

        # number = 10 ** e
        e = int(math.log10(number))
        e_word = swBig[e]
        while not e_word:
            # Move down a power of 10 until an exponent word is found
            e -= 1
            e_word = swBig[e]

        pow_10 = pow(10, e)

        # 12,500 -> (12, 500)
        x, y = divmod(number, pow_10)

        words = [e_word]

        if (x == 1) and (0 < y < 10):
            # 101 -> mia na moja
            words.append(swSeparator)
            words.append(self.cardinalPos(x))
        else:
            # 100 -> mia moja
            words.append(self.cardinalPos(x))
            if y != 0:
                if y < 10:
                    # 201 -> mia mbili na moja
                    words.append(swSeparator)

                # 110 -> mia moja kumi
                words.append(self.cardinalPos(y))

        return " ".join(words)

    def fractional(self, frac, precision):
        frac_str = str(frac)

        # Add zeros to match precision
        frac_str = ("0" * (precision - len(frac_str))) + frac_str

        words = []
        for digit in frac_str:
            words.append(swOnes[int(digit)])

        return " ".join(words)

    def to_currency(self, value):
        return self.to_cardinal(value) + " shilingi"

    def to_ordinal(self, number):
        words = []
        if 2 < number < 9:
            words.append(swOrdinal)

        if number == 1:
            words.append("kwanza")
        elif number == 2:
            words.append("pili")
        else:
            words.append(self.to_cardinal(number))

        return " ".join(words)

    def to_year(self, value):
        value_str = str(value)
        if len(value_str) != 4:
            return self.to_cardinal(value)

        first_num, second_num = int(value_str[:2]), int(value_str[2:])
        words = [self.to_cardinal(first_num), self.to_cardinal(second_num)]
        return " ".join(words)

    def to_ordinal_num(self, value):
        raise NotImplementedError()

    def to_cardinal(self, number):
        if number < 0:
            # Negative number?
            raise NotImplementedError()

        if number == 0:
            return swOnes[0]

        x, y, precision = self.float2tuple(number)
        if y == 0:
            # No fractional part
            return self.cardinalPos(x)

        # x.y
        words = [
            self.to_cardinal(x),
            swDecimalPoint,
            self.fractional(y, precision),
        ]
        return " ".join(words)


# -----------------------------------------------------------------------------


class SWTestCase(unittest.TestCase):
    """Test cases for lang_SW"""

    def test_cardinal(self):
        test_cardinal = {
            21: "ishirini na moja",
            32: "thelathini na mbili",
            43: "arobaini na tatu",
            54: "hamsini na nne",
            65: "sitini na tano",
            76: "sabini na sita",
            87: "themanini na saba",
            98: "tisini na nane",
            101: "mia na moja",
            110: "mia moja kumi",
            111: "mia moja kumi na moja",
            200: "mia mbili",
            249: "mia mbili arobaini na tisa",
            300: "mia tatu",
            400: "mia nne",
            800: "mia nane",
            928: "mia tisa ishirini na nane",
            1997: "elfu moja mia tisa tisini na saba",
            1364: "elfu moja mia tatu sitini na nne",
            5000: "elfu tano",
            8723: "elfu nane mia saba ishirini na tatu",
            12000: "elfu kumi na mbili",
            19284: "elfu kumi na tisa mia mbili themanini na nne",
            29003: "elfu ishirini na tisa na tatu",
            36027: "elfu thelathini na sita ishirini na saba",
            53981: "elfu hamsini na tatu mia tisa themanini na moja",
            60000: "elfu sitini",
            125728: "laki moja elfu ishirini na tano"
            + "mia saba ishirini na nane",
            400000: "laki nne",
            500200: "laki tano mia mbili",
            7000000: "milioni saba",
        }

        conv = Num2Word_SW()

        for num, expected_words in test_cardinal.items():
            actual_words = conv.to_cardinal(num)
            self.assertEqual(expected_words, actual_words)

    def test_ordinal(self):
        test_ordinal = {
            1: "kwanza",
            2: "pili",
            3: "wa tatu",
            4: "wa nne",
            5: "wa tano",
            6: "wa sita",
            7: "wa saba",
            8: "wa nane",
            9: "tisa",
            10: "kumi",
            11: "kumi na moja",
            12: "kumi na mbili",
            13: "kumi na tatu",
            14: "kumi na nne",
            15: "kumi na tano",
            16: "kumi na sita",
            17: "kumi na saba",
            18: "kumi na nane",
            19: "kumi na tisa",
            20: "ishirini",
        }

        conv = Num2Word_SW()

        for num, expected_words in test_ordinal.items():
            actual_words = conv.to_ordinal(num)
            self.assertEqual(expected_words, actual_words)

    def test_fractional(self):
        test_fractional = {
            0.00701: "sifuri nukta sifuri sifuri saba sifuri moja",
            0.224: "sifuri nukta mbili mbili nne",
            2.45: "mbili nukta nne tano",
        }

        conv = Num2Word_SW()

        for num, expected_words in test_fractional.items():
            actual_words = conv.to_cardinal(num)
            print(num, expected_words, actual_words, sep=", ")
            self.assertEqual(expected_words, actual_words)


if __name__ == "__main__":
    unittest.main()
